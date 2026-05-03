<?php

namespace App\Http\Controllers;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Foundation\Validation\ValidatesRequests;
use Illuminate\Routing\Controller as BaseController;
use App\Exceptions\AxiomException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Str;

class Controller extends BaseController
{
    use AuthorizesRequests, ValidatesRequests;

    public function validateMe(Request $request, array $rules, array $messages = [])
    {
        $v = Validator::make($request->all(), $rules, $messages);
        if ($v->fails()) {
            $this->validationToAxiomException($v->errors()->all());
        }
        return $v->validated();
    }

    public function validationToAxiomException($errors)
    {
        foreach ($errors as $error) {
            throw new AxiomException($error);
        }
    }

    public function success($data = null)
    {
        $response = $data;
        if (gettype($data) != 'array') {
            if (!isset($data) || !$data) {
                $response = App::isLocale('en') ? 'Success' : 'Амжилттай.';
            }
        }
        return response()->json(
            ['response_code' => 'success', 'response' => $response],
            200,
            ['Content-Type' => 'application/json;charset=UTF-8', 'Charset' => 'utf-8'],
            JSON_UNESCAPED_UNICODE
        );
    }

    public function error($code, $data = [])
    {
        throw new AxiomException($code, $data);
    }

    public function getGridData(Request $request, $query, $defaultOrderQuery = [], $mandatoryFilters = [])
    {
        $validated = $this->validateMe($request, [
            'filters' => 'nullable|array',
            'filters.*.field' => 'required|max:60',
            'filters.*.value' => 'nullable',
            'filters.*.cond' => 'nullable|max:10',
            'orders' => 'nullable|array',
            'orders.*.field' => 'required|max:60',
            'orders.*.dir' => 'nullable|max:5',
            'perPage' => 'nullable|numeric',
            'page' => 'nullable|numeric'
        ]);

        if (empty($validated['orders'])) {
            $validated['orders'] = $defaultOrderQuery;
        }

        $data = $this->applyFilters($query, $validated['filters'] ?? [], $mandatoryFilters);
        $data = $this->applyOrders($data, $validated['orders'] ?? []);
        
        if ($request->has('isreport') && $request->get('isreport') == 1) {
            $result = $data->get();
            return ['data' => $result];
        } else {
            return $this->applyPaginate($data, $validated['perPage'] ?? null, $validated['page'] ?? null);
        }
    }

    public function applyFilters($query, $filters, $mandatoryFilters = [])
    {
        if (count($mandatoryFilters) > 0 && (empty($filters) || count($filters) == 0)) {
            $this->error('SR0012', ['field' => $mandatoryFilters[0]]);
        }

        foreach ($mandatoryFilters as $mandatoryField) {
            $isInclude = false;
            foreach ($filters as $filter) {
                if ($mandatoryField == $filter['field']) {
                    $isInclude = true;
                }
            }

            if (!$isInclude) {
                $this->error('SR0012', ['field' => $mandatoryField]);
            }
        }

        $validOperators = ['=', '!=', '>', '>=', '<', '<=', 'like', 'notnull', 'null', 'in', 'not in'];

        if (is_array($filters)) {
            foreach ($filters as $filter) {
                $cond = strtolower($filter['cond'] ?? '=');
                
                if (in_array($cond, $validOperators)) {
                    switch ($cond) {
                        case 'like':
                            $query->whereRaw("upper(" . $filter['field'] . ") like upper(?)", [$filter['value']]);
                            break;
                        case 'notnull':
                            $query->whereNotNull($filter['field']);
                            break;
                        case 'null':
                            $query->whereNull($filter['field']);
                            break;
                        case 'in':
                            $query->whereIn($filter['field'], (array)$filter['value']);
                            break;
                        case 'not in':
                            $query->whereNotIn($filter['field'], (array)$filter['value']);
                            break;
                        default:
                            $values = $filter['value'];
                            if (is_array($values)) {
                                $placeholders = implode(', ', array_fill(0, count($values), '?'));
                                $sql = "upper(" . $filter['field'] . ") IN (" . $placeholders . ")";
                                $query->whereRaw($sql, array_map('strtoupper', $values));
                            } else {
                                if (is_numeric($values)) {
                                    $query->where($filter['field'], $cond, $values);
                                } elseif (strtotime($values) !== false && preg_match('/^\d{4}-\d{2}-\d{2}/', $values)) {
                                    $query->whereDate($filter['field'], $cond, $values);
                                } else {
                                    $query->whereRaw("upper(" . $filter['field'] . ") " . $cond . " upper(?)", [$values]);
                                }
                            }
                            break;
                    }
                }
            }
        }
        return $query;
    }

    public function getFiltersQuery($filters)
    {
        $query = '';
        if (is_array($filters)) {
            $isFirst = true;
            foreach ($filters as $filter) {
                if (!empty($filter['value'])) {
                    if (!$isFirst) {
                        $query .= ' AND ';
                    }
                    $isFirst = false;
                    $cond = strtolower($filter['cond'] ?? '=');
                    switch ($cond) {
                        case 'like':
                            $query .= " upper(" . $filter['field'] . ") like upper('" . $filter['value'] . "') ";
                            break;
                        case 'in':
                        case 'not in':
                            $value = (array)$filter['value'];
                            $valueStr = implode("', '", $value);
                            $query .= $filter['field'] . ' ' . $cond . "('" . $valueStr . "')";
                            break;
                        default:
                            $query .= $filter['field'] . " " . $cond . " '" . $filter['value'] . "'";
                            break;
                    }
                }
            }
        }
        return $query;
    }

    public function applyOrders($query, $orders)
    {
        if (is_array($orders)) {
            foreach ($orders as $order) {
                $query->orderBy(Str::lower($order['field']), $order['dir'] ?? 'asc');
            }
        }
        return $query;
    }

    public function applyPaginate($query, $perPage, $page)
    {
        return $query->simplePaginate($perPage ?? 50, ['*'], 'page', $page ?? 1);
    }
}
